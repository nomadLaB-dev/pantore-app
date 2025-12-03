-- Check if the trigger exists on auth.users
select 
    event_object_schema as table_schema,
    event_object_table as table_name,
    trigger_schema,
    trigger_name,
    string_agg(event_manipulation, ',') as event,
    action_timing as activation,
    action_condition as condition,
    action_statement as definition
from information_schema.triggers
where event_object_table = 'users'
and event_object_schema = 'auth'
group by 1,2,3,4,6,7,8;
