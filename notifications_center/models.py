from django.db import models
from django.utils import timezone
from account.models import User

# Create your models here.
class BroadcastNotification(models.Model):
    subject = models.CharField(max_length=100)
    message = models.TextField()
    broadcast_on = models.DateTimeField(default=timezone.now)
    read_by = models.ManyToManyField(User, blank=True, related_name="read_by")

    class Meta:
        ordering = ['-broadcast_on']


    def __str__(self):
        return self.subject


NOTIFICATION_TYPE = (
    ('DAILY SPIN REWARD', 'DAILY SPIN REEARD'),
    ('DEPOSIT', 'DEPOSIT'),
    ('GIFT REDEMPTION', 'GIFT REDEMPTION'), 
    ('LOGIN NOTIFICATION', 'LOGIN NOTIFICATION'),
    ('LOGIN REWARD', 'LOGIN REWARD'),
    ('REFERRAL NOTIFICATION', 'REFERRAL NOTIFICATION'),
    ('REGISTERATION GIFT', 'REGISTERATION GIFT'),
    ('TIER UPGRADE', 'TIER UPGRADE'),
    ('WITHDRAWAL', 'WITHDRAWAL'),
)


class UserNotification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    notification_type = models.CharField(max_length=100, choices=NOTIFICATION_TYPE, default="LOGIN NOTIFICATION")
    message = models.TextField()
    notified_on = models.DateTimeField(default=timezone.now)
    read = models.BooleanField(default=False)


    class Meta:
        ordering = ['-notified_on']


    def __str__(self):
        return f"{self.user}'s {self.notification_type} on {self.notified_on}"


