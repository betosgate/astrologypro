-- Normalize trainee contract requirements.
--
-- Trainees are not diviners yet, so they should not be required to sign the
-- Diviner Service Agreement. Until a dedicated Trainee Program Agreement
-- exists, trainees accept the Customer Terms of Service.

DO $$
DECLARE
  customer_template_id uuid;
BEGIN
  SELECT id
  INTO customer_template_id
  FROM public.contract_templates
  WHERE family_key = 'customer-access'
    AND is_active = true
  ORDER BY is_current_consolidated DESC, effective_date DESC, created_at DESC
  LIMIT 1;

  IF customer_template_id IS NULL THEN
    RAISE EXCEPTION 'Cannot normalize trainee contracts: no active customer-access contract template found';
  END IF;

  UPDATE public.role_contract_requirements AS rcr
  SET
    contract_template_id = customer_template_id,
    priority = LEAST(COALESCE(rcr.priority, 10), 10),
    is_required = true,
    is_active = true
  WHERE rcr.role_key = 'trainee'
    AND rcr.trigger_event = 'post_login'
    AND rcr.contract_template_id IN (
      SELECT id
      FROM public.contract_templates
      WHERE family_key = 'diviner-services'
    );

  INSERT INTO public.role_contract_requirements (
    role_key,
    contract_template_id,
    is_required,
    trigger_event,
    priority,
    is_active
  )
  SELECT
    'trainee',
    customer_template_id,
    true,
    'post_login',
    10,
    true
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.role_contract_requirements
    WHERE role_key = 'trainee'
      AND trigger_event = 'post_login'
      AND contract_template_id = customer_template_id
  );

  UPDATE public.user_contract_requirements AS ucr
  SET
    status = 'superseded',
    blocking = false,
    updated_at = now()
  WHERE ucr.role_key = 'trainee'
    AND ucr.trigger_event = 'post_login'
    AND ucr.status = 'pending'
    AND ucr.contract_template_id IN (
      SELECT id
      FROM public.contract_templates
      WHERE family_key = 'diviner-services'
    );
END $$;
