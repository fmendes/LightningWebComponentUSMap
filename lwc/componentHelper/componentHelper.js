import { LightningElement, wire, api } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { registerListener, unregisterAllListeners, fireEvent } from 'c/pubsub';

export default class ComponentHelper extends LightningElement {
    @wire( CurrentPageReference ) pageRef;

    @api source;
    @api recordId;
    @api componentName;
    @api SOQL;
    @api payloadTemplate;

    // initialization
    connectedCallback() {
        // subscribe to sourceDataChangeEvent
        registerListener( 'sourceDataChangeEvent', this.handleSourceDataChange, this );
    }

    handleSourceDataChange( event ) {
        // parse event detail and change each attribute of the map accordingly
        window.console.log( 'handleSourceDataChange event received by componentHelper'
                            , this.componentName, JSON.stringify( event ) );

        // only accept event from matching datasource
        if( event.dataSource != this.source ) {
            return;
        }

        // insert query results into the template and publish it
        this.publishData( event.result );
    }

    publishData( recordList ) {

        let payloadTemplate = this.payloadTemplate;

        let repeaterRegEx = new RegExp( "(\\[.*?\\])", "g" );
        let fieldRegEx = new RegExp( "(\\{.*?\\})", "g" );
        let matchArray = payloadTemplate.match( repeaterRegEx );
        
        // eslint-disable-next-line no-console
        console.log( 'matchArray= ', matchArray );

        // eslint-disable-next-line no-console
        console.log( 'recordList.length= ', recordList.length );

        // replace field names in the template with field values
        let patternArray = {};
        for( let i = 0; i < recordList.length; i++ ) {
            // aRecord = { State__c: 'WA', Percent__c: 10.0 }
            const aRecord = recordList[ i ];

            // for each repeater pattern, create list of patterned values
            for( let j = 0; j < matchArray.length; j++ ) {
                // EXAMPLE:  aRepeater = {State__c}:{Percent__c}
                let aRepeater = matchArray[ j ].replace( '[', '' ).replace( ']', '' );
                let fieldArray = aRepeater.match( fieldRegEx );
        
                let renderedItemArray = [];
                let renderedItem = aRepeater;

                // for each field in the pattern, replace it with its value
                for( let k = 0; k < fieldArray.length; k++ ) {
                    // EXAMPLE:  aField = {State__c}
                    let aField = fieldArray[ k ];
                    let fieldName = aField.replace( '{', '' ).replace( '}', '' );

                    // get field value from record
                    let aValue = aRecord[ fieldName ];

                    renderedItem = renderedItem.replace( aField, aValue );
                }

                // EXAMPLE:  renderedItem = GA:50%
                renderedItemArray.push( renderedItem );

                if( ! patternArray[ aRepeater ] ) {
                    patternArray[ aRepeater ] = [];
                }
                patternArray[ aRepeater ].push( renderedItemArray );
            }
        }

        // for each pattern, replace it with the respective value in the template
        for( let key in patternArray ) {
            if( patternArray.hasOwnProperty( key ) ) {
                let aPattern = `[${key}]`;
                payloadTemplate = payloadTemplate.replace( aPattern, patternArray[ key ] );
            }
        }

        // eslint-disable-next-line no-console
        console.log( 'payloadTemplate= ', payloadTemplate );

        const payloadToMerge = JSON.parse( payloadTemplate );

        // send event to other components after applying template format to the data
        payloadToMerge.dataSource = this.componentName;

        window.console.log( 'firing formattedDataAvailableEvent from componentHelper: ', this.componentName );

        fireEvent( this.pageRef, 'formattedDataAvailableEvent', payloadToMerge );
    }

    disconnectedCallback() {
        // unsubscribe from all events
        unregisterAllListeners( this );
    }
}