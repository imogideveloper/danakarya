# Generated manually

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('loans', '0008_rename_id_card_document_to_selfie_document'),
    ]

    operations = [
        migrations.RenameField(
            model_name='loanapplication',
            old_name='ktp_document',
            new_name='signature_document',
        ),
    ]
