from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("quotes", "0003_quoterequest_customer"),
    ]

    operations = [
        migrations.RenameField("customer", "company", "company_name"),
        migrations.RenameField("quoterequest", "company", "company_name"),
    ]
