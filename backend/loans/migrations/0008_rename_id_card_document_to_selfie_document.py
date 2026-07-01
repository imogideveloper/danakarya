# Generated manually

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('loans', '0007_loanapplication_verified_by_verified_at'),
    ]

    operations = [
        migrations.RenameField(
            model_name='loanapplication',
            old_name='id_card_document',
            new_name='selfie_document',
        ),
    ]
