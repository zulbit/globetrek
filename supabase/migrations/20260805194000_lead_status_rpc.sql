-- RPC function to securely update lead status with automatic ENUM normalization
CREATE OR REPLACE FUNCTION public.update_lead_status(_lead_id uuid, _status text)
RETURNS public.leads
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _lead public.leads;
  _enum_status public.service_lead_status;
BEGIN
  SELECT * INTO _lead FROM public.leads WHERE id = _lead_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead not found';
  END IF;

  IF _lead.vendor_id <> auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized to update this lead';
  END IF;

  -- Normalize status string to service_lead_status enum
  IF _status = 'converted' OR _status = 'won' THEN
    _enum_status := 'won'::public.service_lead_status;
  ELSIF _status = 'closed' OR _status = 'lost' THEN
    _enum_status := 'lost'::public.service_lead_status;
  ELSIF _status = 'contacted' THEN
    _enum_status := 'contacted'::public.service_lead_status;
  ELSIF _status = 'new' THEN
    _enum_status := 'new'::public.service_lead_status;
  ELSE
    _enum_status := 'contacted'::public.service_lead_status;
  END IF;

  UPDATE public.leads
     SET status = _enum_status
   WHERE id = _lead_id
  RETURNING * INTO _lead;

  RETURN _lead;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_lead_status(uuid, text) TO authenticated;
