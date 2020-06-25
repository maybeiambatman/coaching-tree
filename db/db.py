import boto3
import uuid


class DynamoDB:
    def __init__(self, table_name):
        self.client = boto3.client('dynamodb')
        self.table_name = table_name

    def _init_dynamodb_if_needed(self):
        if not self.client:
            self.client = boto3.client('dynamodb')

    def put_person(self, name, children=[], parents=[]):
        self._init_dynamodb_if_needed()

        item = {
            'id': {'S': str(uuid.uuid4())},
            'name': {'S': name},
        }
        if children:
            item['children'] = {'SS': children }
        if parents:
            item['parents'] = {'SS': parents }

        response = self.client.put_item(
            TableName=self.table_name,
            Item=item
        )
        return response

