### Commands:

To run migrations:

```shell
docker compose run up backend postgres   
docker compose exec backend npm run migrate up  
```

To reapply last migration:

```shell
# roll it back                                                                    
docker compose exec backend npm run migrate -- down 1                                                         
                                                                                    
# re-apply it                                                                     
docker compose exec backend npm run migrate -- up 1
```

To get all constraints:

```shell
docker exec tic-tac-toe-postgres psql -U postgres -d tic_tac_toe -c "SELECT conname, conrelid::regclass AS table, contype, pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE connamespace = 'public'::regnamespace ORDER BY conrelid::regclass::text, conname;"
```