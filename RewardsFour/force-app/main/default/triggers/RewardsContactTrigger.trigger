trigger RewardsContactTrigger on Contact (after update) {

    if (Trigger.isAfter && Trigger.isUpdate) {
        RewardsEventHandler.removePointsHistory(Trigger.new, Trigger.oldMap);
    }

}