import cron from 'node-cron';
import { runRiskAnalysis } from './risk-analyzer';

export function startScheduledJobs(): void {
  // Run risk analysis at 2 AM UTC daily
  cron.schedule('0 2 * * *', async () => {
    console.log('[Scheduler] Starting nightly risk analysis...');
    try {
      await runRiskAnalysis();
    } catch (error: any) {
      console.error('[Scheduler] Risk analysis failed:', error.message);
    }
  });

  console.log('[Scheduler] Nightly risk analysis scheduled for 2:00 AM UTC');
}
