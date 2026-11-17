-- Dedicated global click rotation. No client/contact/property records are changed.
-- CACHE 1 preserves consecutive allocation across different server connections.
CREATE SEQUENCE public.property_whatsapp_turn AS bigint MINVALUE 0 START 0 INCREMENT 1 CACHE 1;
REVOKE ALL ON SEQUENCE public.property_whatsapp_turn FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SEQUENCE public.property_whatsapp_turn TO service_role;

CREATE FUNCTION public.next_property_whatsapp()
RETURNS text LANGUAGE sql VOLATILE SECURITY INVOKER SET search_path = ''
AS $$
  SELECT CASE pg_catalog.nextval('public.property_whatsapp_turn'::regclass) % 2
    WHEN 0 THEN '56944637680' ELSE '56944717233' END;
$$;
REVOKE ALL ON FUNCTION public.next_property_whatsapp() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.next_property_whatsapp() TO service_role;
