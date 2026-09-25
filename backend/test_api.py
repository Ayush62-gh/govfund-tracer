import sys
from fastapi.testclient import TestClient
from main import app

sys.stdout.reconfigure(encoding='utf-8')

client = TestClient(app)

def test_endpoints():
    print("Testing GET / ...")
    res = client.get("/")
    assert res.status_code == 200
    print("Root response:", res.json())

    print("\nTesting GET /works ...")
    res = client.get("/works?limit=5")
    assert res.status_code == 200
    data = res.json()
    print(f"Works total: {data['total']}, count returned: {len(data['items'])}")
    first_item = data['items'][0]
    print("First work item sample:")
    for k in ["work_id", "source", "state", "category", "ida", "risk_score", "flags", "explanation", "sanction_amount"]:
        print(f"  {k}: {first_item.get(k)}")
    assert "source" in first_item

    work_id = first_item['work_id']

    print(f"\nTesting GET /works/{work_id} ...")
    res = client.get(f"/works/{work_id}")
    assert res.status_code == 200
    single_work = res.json()
    assert single_work["source"] in ["matched", "sanctioned_only", "completed_only"]
    print(f"Single work status 200 OK (source: {single_work['source']})")

    print(f"\nTesting GET /works/{work_id}/risk ...")
    res = client.get(f"/works/{work_id}/risk")
    assert res.status_code == 200
    print("Risk placeholder response:", res.json())

    print("\nTesting GET /summary ...")
    res = client.get("/summary")
    assert res.status_code == 200
    summary = res.json()
    print("Summary aggregate metrics:")
    print(f"  Total works: {summary['total_works']}")
    print(f"  Total sanctioned amount: ₹{summary['total_sanctioned_amount']:,.2f}")
    print(f"  Total disbursed amount: ₹{summary['total_disbursed_amount']:,.2f}")
    print(f"  Source breakdown: {summary['by_source']}")
    print(f"  Top states: {list(summary['by_state'].keys())[:5]}")
    print(f"  Top categories: {list(summary['by_category'].keys())[:5]}")
    print(f"  Work statuses: {summary['by_status']}")
    assert "by_source" in summary

    print("\nAll endpoint tests PASSED successfully!")

if __name__ == "__main__":
    test_endpoints()
