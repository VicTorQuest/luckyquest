from django.contrib import admin
from .models import  ReferralBonus, Transaction, DepositIssue

# Register your models here.
class ReferralBonusAdmin(admin.ModelAdmin):
    search_fields = ['referral__referred_by', 'referral__user']
    list_display = ['referral', 'referral_bonus','date']
    list_filter = ['referral', 'date']


class TransactionAdmin(admin.ModelAdmin):
    search_fields = ['user__username', 'transaction_id']
    list_display = ['user', 'amount', 'transaction_type', 'status',  'transaction_id','date', 'approved']
    list_filter = ['date', 'status' ,'approved', 'transaction_type']
    # exclude = ['approved_already_clicked']


class DepositIssueAdmin(admin.ModelAdmin):
    search_fields = ['user__username', 'transaction__transaction_id', 'transction_reference_number']
    list_display = ['user', 'transaction', 'transction_reference_number']


admin.site.register(ReferralBonus, ReferralBonusAdmin)
admin.site.register(Transaction, TransactionAdmin)
admin.site.register(DepositIssue, DepositIssueAdmin)
