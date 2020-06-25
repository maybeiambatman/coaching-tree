import json
from db.db import DynamoDB


def add_coaching_node(event, context):
    request_body = json.loads(event['body'])
    dynamo_db = DynamoDB(table_name=request_body['type'])
    response = dynamo_db.put_person(
        name=request_body['name'],
        children=request_body['children'],
        parents=request_body['parents']
    )
    return {
        'statusCode': 200,
        'body': json.dumps(response)
    }