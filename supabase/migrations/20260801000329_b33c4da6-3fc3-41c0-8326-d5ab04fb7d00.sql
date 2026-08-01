GRANT EXECUTE ON FUNCTION public.redeem_access_code(uuid, text) TO service_role;
NOTIFY pgrst, 'reload schema';