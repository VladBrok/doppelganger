import cron from "node-cron";
import { spawn } from "child_process";
import config from "./config.json" assert { type: "json" };

for (const meeting of config.meetings) {
  const time = `${meeting.minute} ${meeting.hour} * * ${meeting.daysOfWeek.join(
    ","
  )}`;

  cron.schedule(
    time,
    () => {
      const bot = spawn("node", ["bot.js", meeting.url]);

      bot.stdout.on("data", (data) => {
        console.log(`${meeting.url} stdout:`, data.toString());
      });

      bot.stderr.on("data", (data) => {
        console.log(`${meeting.url} stderr:`, data.toString());
      });
    },
    {
      timezone: config.timezone,
    }
  );
}
