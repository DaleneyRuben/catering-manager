-- Schema rules that the application relies on but cannot enforce or test itself.
--
-- Every backend test mocks the models, so a rule that lives in the database is invisible to the
-- suite. These assertions run against the throwaway database CI builds from the migrations, so a
-- migration that quietly changes one of them fails the build instead of production.
--
-- Each block raises an exception naming the rule and what it found.

DO $$
DECLARE
  action char;
BEGIN
  -- Deleting a renewal must delete the cita that resolved into it, so a cita the nutritionist has
  -- already acted on never returns to her queue. 'c' = CASCADE.
  SELECT confdeltype INTO action
  FROM pg_constraint
  WHERE conrelid = 'appointments'::regclass
    AND contype = 'f'
    AND conkey = ARRAY[(
      SELECT attnum FROM pg_attribute
      WHERE attrelid = 'appointments'::regclass AND attname = 'subscriptionId'
    )]::smallint[];

  IF action IS NULL THEN
    RAISE EXCEPTION 'appointments."subscriptionId" has no foreign key to subscriptions';
  END IF;

  IF action <> 'c' THEN
    RAISE EXCEPTION
      'appointments."subscriptionId" must be ON DELETE CASCADE, found confdeltype=%', action;
  END IF;
END $$;

\echo 'schema rules OK'
