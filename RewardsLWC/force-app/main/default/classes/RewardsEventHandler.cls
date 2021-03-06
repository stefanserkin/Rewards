public without sharing class RewardsEventHandler {
    
    public static void verifyActiveAccount(List<Rewards_Event__c> resInTrigger) {
        
        List<Contact> inactiveCts = new List<Contact>();
        Set<Id> ctIds = new Set<Id>();
        
        for (Rewards_Event__c re : resInTrigger) {
            if (re.Active__c == true) {
                ctIds.add(re.Contact__c);
            }
        }
        // Get contacts
        List<Contact> ctList = [SELECT Id,
                                       Active_Rewards_Account__c
                                  FROM Contact
                                 WHERE Id IN :ctIds
                                 LIMIT 1000];
        // Add contacts with inactive rewards accounts
        for (Contact ct : ctList) {
            if (!ct.Active_Rewards_Account__c) {
                inactiveCts.add(ct);
            }
        }
        // Find matching re in trigger and throw error
        for (Contact ct : inactiveCts) {
            for (Rewards_Event__c re: resInTrigger) {
                if (re.Contact__c == ct.Id) {
                    re.addError('This contact does not have an active rewards account.');
                }
            }
        }
    }
    
    public static void setRunningBalance(List<Rewards_Event__c> resInTrigger) {

        Set<Id> setContactIds = new Set<Id>();
        
        for (Rewards_Event__c re : resInTrigger) {
            setContactIds.add(re.Contact__c);
        }
        
        List<Contact> relatedContacts = [SELECT Id,
                                                Rewards_Points__c 
                                           FROM Contact
                                          WHERE Id IN :setContactIds
                                            AND Rewards_Points__c != null AND Rewards_Points__c != 0];
        
        for (Rewards_Event__c re : resInTrigger) {
            // Initialize balance
            Decimal reBalance = 0;
            // Find matching contact
            for (Contact ct : relatedContacts) {
                if (ct.Id == re.Contact__c && ct.Rewards_Points__c != null) {
                    // Set balance from matching contact
                    // TODO Sum of Rewards Events, instead
                    //      Corrects for deleted records since last time calculated
                    reBalance += ct.Rewards_Points__c;
                }
            }
            
            // Add points from re in trigger and assign balance
            if (re.Points__c != null) {
                if (re.Type__c == 'Award') {
                    re.Points_Balance__c = reBalance + re.Points__c;
                } else if (re.Type__c == 'Redemption') {
                    re.Points_Balance__c = reBalance - re.Points__c;
                }
            }
            // Set any null dates
            if (re.Date__c == null) {
                re.Date__c = DateTime.now();
            }
        }
        
    }
    
    public static void updatePointsForContact(List<Rewards_Event__c> resInTrigger) {
        
        Set<Id> setContactIds = new Set<Id>();
        for (Rewards_Event__c re : resInTrigger) {
            setContactIds.add(re.Contact__c);
        }
        
        // Get contacts and related rewards events
        List<Contact> lstContacts = [SELECT Id,
                                            Rewards_Points__c,
                                            Active_Rewards_Account__c,
                                            (SELECT Id,
                                                    Type__c,
                                                    Points__c,
                                                    Points_Balance__c
                                               FROM Rewards_Events__r
                                              WHERE Active__c = true
                                              ORDER BY Date__c DESC)
                                       FROM Contact
                                      WHERE Id IN :setContactIds
                                        AND Active_Rewards_Account__c = true
                                      LIMIT 200];
        
        for (Contact ct : lstContacts) {
            // Reset balance to zero
            Decimal pointsBalance = 0;
            // Add up rewards events
            for (Rewards_Event__c re : ct.Rewards_Events__r) {
                if (re.Type__c == 'Award') {
                    pointsBalance += re.Points__c;
                    ct.Last_Points_Awarded__c = Date.today();
                } else if (re.Type__c == 'Redemption') {
                    pointsBalance -= re.Points__c;
                    ct.Last_Points_Redeemed__c = Date.today();
                }
            }
            
            // Assign balance to Contact
            ct.Rewards_Points__c = pointsBalance;

        }
        if (!lstContacts.isEmpty()) {
            update lstContacts;
        }

    }

    public static void removePointsHistory(List<Contact> ctsInTrigger, Map<Id, Contact> ctOldMapInTrigger) {

        String redemptionRecTypeId = Schema.SObjectType.Rewards_Event__c.getRecordTypeInfosByName().get('Redemption').getRecordTypeId();

        List<Rewards_Event__c> lstResToInsert = new List<Rewards_Event__c>();
        List<Rewards_Event__c> lstResToUpdate = new List<Rewards_Event__c>();

        Set<Id> ctIds = new Set<Id>();
        for (Contact ct : ctsInTrigger) {
            Boolean oldIsActive = ctOldMapInTrigger.get(ct.Id).Active_Rewards_Account__c;
            Boolean newIsActive = ct.Active_Rewards_Account__c;

            if (!newIsActive && oldIsActive) {
                ctIds.add(ct.Id);
            }
        }

        // Get contacts with rewards events to calculate total for equalizing event
        List<Contact> lstContacts = [SELECT Id,
                                            Rewards_Points__c,
                                            Active_Rewards_Account__c,
                                            (SELECT Id,
                                                    Type__c,
                                                    Points__c,
                                                    Points_Balance__c
                                               FROM Rewards_Events__r
                                              WHERE Active__c = true
                                              ORDER BY Date__c DESC)
                                       FROM Contact
                                      WHERE Id IN :ctIds];
        for (Contact ct : lstContacts) {
            // Reset balance to zero
            Decimal pointsBalance = 0;
            // Add up rewards events
            for (Rewards_Event__c re : ct.Rewards_Events__r) {
                if (re.Type__c == 'Award') {
                    pointsBalance += re.Points__c;
                } else if (re.Type__c == 'Redemption') {
                    pointsBalance -= re.Points__c;
                }
                re.Active__c = false;
                lstResToUpdate.add(re);
            }
            
            // Create equalizing record
            Rewards_Event__c reEqualizer = new Rewards_Event__c();
            reEqualizer.Points__c = pointsBalance;
            reEqualizer.Description__c = 'Account Deactivated';
            reEqualizer.RecordTypeId = redemptionRecTypeId;
            reEqualizer.Active__c = false;
            reEqualizer.Contact__c = ct.Id;

            lstResToInsert.add(reEqualizer);

        }
        
        if (!lstResToInsert.isEmpty()) {
            insert lstResToInsert;
        }
        if (!lstResToUpdate.isEmpty()) {
            update lstResToUpdate;
        }
        
        
    }

}