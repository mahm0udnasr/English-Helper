-- Call the send-reminders Edge Function every 5 minutes. The URL and shared
-- secret are read from Vault at run time, so nothing sensitive is stored here.
select vault.create_secret(
  'https://zfaeflgphzikjuvrezrd.supabase.co/functions/v1/send-reminders',
  'send_reminders_url',
  'Endpoint pg_cron calls to send daily reminders'
);

select cron.schedule(
  'send-daily-reminders',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'send_reminders_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'reminder_cron_secret')
    ),
    body := '{"mode":"cron"}'::jsonb,
    timeout_milliseconds := 20000
  );
  $$
);
