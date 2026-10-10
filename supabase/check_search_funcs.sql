SELECT proname, prosecdef, proconfig, pg_get_functiondef(oid)
FROM pg_proc
WHERE proname IN ('search_dictionary', 'search_hanzi_master');
