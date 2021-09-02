/*
 * Created by Stefan Serkin on March 26, 2021
 * */

trigger RewardsEventTrigger on Rewards_Event__c (before insert, after insert, before update, after update, after delete) {

    if (Trigger.isBefore) {
        if (Trigger.isInsert) {
            RewardsEventHandler.verifyActiveAccount(Trigger.new);
            RewardsEventHandler.setRunningBalance(Trigger.new);
        } else if (Trigger.isUpdate) {
            // RewardsEventHandler.verifyActiveAccount(Trigger.new);
        } 
    } else if (Trigger.isAfter) {
        if (Trigger.isInsert || Trigger.isUpdate) {
            RewardsEventHandler.updatePointsForContact(Trigger.new);
        } else if (Trigger.isDelete) {
            RewardsEventHandler.updatePointsForContact(Trigger.old);
        }
    }
    
}