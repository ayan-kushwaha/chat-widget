import clickhouse_connect
try:
    print("Connecting to ClickHouse at 127.0.0.1:8123 as 'cluaiz_engine'...")
    client = clickhouse_connect.get_client(host='127.0.0.1', port=8123, username='cluaiz_engine', password='vault_pass_2026', database='cluaiz')
    print(f"SUCCESS: Connected to ClickHouse")
    
    # Insert dummy data
    client.command("INSERT INTO archived_memories (org_id, topic_id, title, summary, importance_score) VALUES ('persist_test', 't1', 'title', 'sum', 0.5)")
    print("SUCCESS: Inserted test row")
    
    # Read back
    result = client.query("SELECT count() FROM archived_memories WHERE org_id = 'persist_test'")
    count = result.result_rows[0][0]
    print(f"SUCCESS: Row count in Python: {count}")
    
    # Verify via docker exec
    import subprocess
    print("Verifying via Docker...")
    out = subprocess.check_output("docker exec cluaiz-clickhouse clickhouse-client --query \"SELECT count() FROM cluaiz.archived_memories WHERE org_id = 'persist_test'\"", shell=True)
    print(f"SUCCESS: Row count in Docker: {out.decode().strip()}")
except Exception as e:
    import traceback
    print(f"FAILURE: {e}")
    traceback.print_exc()
