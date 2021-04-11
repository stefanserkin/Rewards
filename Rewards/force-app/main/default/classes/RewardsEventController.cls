/* *
 * Created by Stefan Serkin on March 27, 2021
 * */
public with sharing class RewardsEventController {

    @AuraEnabled
    public static void activateRewards(String recordId){
        if (Schema.sObjectType.Contact.isUpdateable() && 
            Schema.sObjectType.Contact.fields.Active_Rewards_Account__c.isUpdateable()) {
                Contact ct = [SELECT Id, Active_Rewards_Account__c 
                                FROM Contact 
                               WHERE Id = :recordId 
                                WITH SECURITY_ENFORCED 
                               LIMIT 1];
                ct.Active_Rewards_Account__c = true;
                try {
                    update ct;
                } catch (Exception e) {
                    throw new AuraHandledException(e.getMessage());
                }
                
            }
    }

    @AuraEnabled(cacheable=true)
    public static List<Rewards_Event__c> getContactRewardsEvents(Id recordId) {
        return [SELECT Id, Type__c, Date__c, Description__c, Points__c, Points_Balance__c
                  FROM Rewards_Event__c
                 WHERE Contact__c = :recordId
                  WITH SECURITY_ENFORCED 
                 ORDER BY Date__c DESC
                 LIMIT 15];
    }

    @AuraEnabled(cacheable=true)
    public static List<DataTableWrapper> getContactRewardsEvents2(String recordId) {

        List<Rewards_Event__c> reList = [SELECT Id, Type__c, Date__c, Description__c, Points__c, Points_Balance__c
                                           FROM Rewards_Event__c 
                                          WHERE Contact__c = :recordId
                                           WITH SECURITY_ENFORCED
                                          ORDER BY Date__c DESC
                                          LIMIT 25];

        List<DataTableWrapper> response = new List<DataTableWrapper>();
        for (Rewards_Event__c re : reList) {
            DataTableWrapper obj = new DataTableWrapper();
            obj.reId          = re.Id;
            obj.reDate        = re.Date__c;
            obj.type          = re.Type__c;
            obj.description   = re.Description__c;
            obj.points        = re.Points__c;
            obj.pointsBalance = re.Points_Balance__c;

            response.add(obj);
        }
        
        return response;
    }

    private class DataTableWrapper {
        @AuraEnabled
        public Id reId {get;set;}
        @AuraEnabled
        public Datetime reDate {get;set;}
        @AuraEnabled
        public String type {get;set;}
        @AuraEnabled
        public String description {get;set;}
        @AuraEnabled
        public Decimal points {get;set;}
        @AuraEnabled
        public Decimal pointsBalance {get;set;}
    }

    @AuraEnabled(cacheable=true)
    public static List<Rewards_Event__c> getRewardsEvents(Id recordId) {
        return [SELECT Id, Points__c, Description__c
                  FROM Rewards_Event__c
                 WHERE Contact__c = :recordId
                  WITH SECURITY_ENFORCED 
                 ORDER BY CreatedDate DESC
                 LIMIT 5];
    }

}