SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename LIKE 'exam%'
ORDER BY tablename, indexname;
