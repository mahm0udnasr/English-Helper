-- Call the resync-channels Edge Function every Monday at 03:00 UTC to refresh
-- channel names and photos. It shares send-reminders' cron secret; the URL
-- and secret are read from Vault at run time.
select vault.create_secret(
  'https://zfaeflgphzikjuvrezrd.supabase.co/functions/v1/resync-channels',
  'resync_channels_url',
  'Endpoint pg_cron calls to refresh channel names and photos'
);

select cron.schedule(
  'resync-channels-weekly',
  '0 3 * * 1',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'resync_channels_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'reminder_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);
