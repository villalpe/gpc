from rest_framework import serializers


class FedexTrackRequestSerializer(serializers.Serializer):
    tracking_number = serializers.CharField(max_length=50)

class SkydropxTrackRequestSerializer(serializers.Serializer):
    tracking_number = serializers.CharField(max_length=60)    