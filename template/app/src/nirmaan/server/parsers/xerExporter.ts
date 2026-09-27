// ponytail: Clean string generator for Primavera P6 .XER write-back; zero heavy dependencies.


export interface ActivityActuals {
  activityCode: string;
  name: string;
  wbsPath: string;
  plannedDurationDays: number;
  plannedStart: Date;
  plannedFinish: Date;
  actualStart?: Date | null;
  actualFinish?: Date | null;
  percentComplete: number;
  isCriticalPath?: boolean;
}

export interface DependencyRecord {
  predecessorCode: string;
  successorCode: string;
  dependencyType: string;
  lagDays: number;
}

/**
 * Generates an authentic Oracle Primavera P6 .XER export format string
 * with updated actuals, progress, and status codes.
 */
export function generatePrimaveraXER(params: {
  projectCode: string;
  projectName: string;
  plannedStartDate: Date;
  plannedFinishDate: Date;
  activities: ActivityActuals[];
  dependencies: DependencyRecord[];
}): string {
  const {
    projectCode,
    projectName,
    plannedStartDate,
    plannedFinishDate,
    activities,
    dependencies,
  } = params;

  const formatDate = (d?: Date | null): string => {
    if (!d || isNaN(d.getTime())) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const lines: string[] = [];
  lines.push('ERPROJECT');

  // 1. PROJECT table
  lines.push('%T\tPROJECT');
  lines.push('%F\tproj_id\tproj_short_name\tproject_name\tplan_start_date\tplan_end_date');
  lines.push(`%R\t1001\t${projectCode}\t${projectName}\t${formatDate(plannedStartDate)}\t${formatDate(plannedFinishDate)}`);

  // 2. PROJWBS table (collect unique WBS paths)
  const uniqueWbs = Array.from(new Set(activities.map(a => a.wbsPath || 'General')));
  lines.push('%T\tPROJWBS');
  lines.push('%F\twbs_id\tproj_id\twbs_name\twbs_short_name');
  uniqueWbs.forEach((wbs, idx) => {
    const wbsId = 2000 + idx;
    const shortName = wbs.split('>').pop()?.trim() || `WBS-${idx}`;
    lines.push(`%R\t${wbsId}\t1001\t${wbs}\t${shortName.substring(0, 20)}`);
  });

  const wbsToIdMap = new Map<string, number>();
  uniqueWbs.forEach((wbs, idx) => wbsToIdMap.set(wbs, 2000 + idx));

  // 3. TASK table
  lines.push('%T\tTASK');
  lines.push(
    '%F\ttask_id\tproj_id\twbs_id\ttask_code\ttask_name\ttarget_start_date\ttarget_end_date\tact_start_date\tact_end_date\ttarget_drtn_hr_cnt\tphys_percent_complete\tstatus_code'
  );

  const codeToTaskIdMap = new Map<string, number>();

  activities.forEach((act, idx) => {
    const taskId = 3000 + idx;
    codeToTaskIdMap.set(act.activityCode, taskId);
    const wbsId = wbsToIdMap.get(act.wbsPath || 'General') || 2000;
    const durHours = (act.plannedDurationDays * 8.0).toFixed(1);

    let statusCode = 'TK_NotStart';
    if (act.percentComplete >= 100 || act.actualFinish) {
      statusCode = 'TK_Complete';
    } else if (act.percentComplete > 0 || act.actualStart) {
      statusCode = 'TK_Active';
    }

    lines.push(
      `%R\t${taskId}\t1001\t${wbsId}\t${act.activityCode}\t${act.name}\t${formatDate(act.plannedStart)}\t${formatDate(act.plannedFinish)}\t${formatDate(act.actualStart)}\t${formatDate(act.actualFinish)}\t${durHours}\t${act.percentComplete.toFixed(1)}\t${statusCode}`
    );
  });

  // 4. TASKPRED table
  lines.push('%T\tTASKPRED');
  lines.push('%F\ttask_pred_id\ttask_id\tpred_task_id\tpred_type\tlag_hr_cnt');

  dependencies.forEach((dep, idx) => {
    const predTaskId = codeToTaskIdMap.get(dep.predecessorCode);
    const succTaskId = codeToTaskIdMap.get(dep.successorCode);
    if (!predTaskId || !succTaskId) return;

    const predId = 4000 + idx;
    const lagHours = (dep.lagDays * 8.0).toFixed(1);
    const predType = dep.dependencyType === 'SS' ? 'PR_SS' : dep.dependencyType === 'FF' ? 'PR_FF' : 'PR_FS';

    lines.push(`%R\t${predId}\t${succTaskId}\t${predTaskId}\t${predType}\t${lagHours}`);
  });

  lines.push('%E');
  lines.push('');

  return lines.join('\n');
}
