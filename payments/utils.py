import uuid



def generate_trx_id(instance):
    klass = instance.__class__
    code = str(uuid.uuid4())
    if klass.objects.filter(transaction_id=code).exists():
        generate_trx_id(instance)
    return code