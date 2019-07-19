public without sharing class LightningWebComponentHelper {
    @AuraEnabled(cacheable=true)
    public static List<Object> dynamicQuery( String soqlParam ) {
        system.debug( 'soqlParam= ' + soqlParam );

        if( isQueryAggregate( soqlParam ) ) {
            AggregateResult[] aList = Database.query( soqlParam );
            system.debug( 'aList= ' + aList );
            return aList;
        }

        List<SObject> aList = Database.query( soqlParam );
        system.debug( 'aList= ' + aList );
        return aList;
    }

    public static Boolean isQueryAggregate( String soqlParam ) {
        // detect aggregate query
        Set<String> aggregateKeywords = new Set<String> {
            'GROUP BY', 'MIN(', 'MAX(', 'COUNT(', 'AVG('
        };
        Boolean queryIsAggregate = false;
        for( String aKeyword : aggregateKeywords ) {
            if( soqlParam.containsIgnoreCase( aKeyword ) ) {
                return true;
            }
        }

        return false;
    }
}
