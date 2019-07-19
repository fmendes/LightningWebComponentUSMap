import { LightningElement, wire, api } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { fireEvent } from 'c/pubsub';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import dynamicQuery from '@salesforce/apex/LightningWebComponentHelper.dynamicQuery';

export default class DataSourceQuery extends LightningElement {
    @wire( CurrentPageReference ) pageRef;

    @api recordId;
    @api componentName;
    @api SOQL;

    // initialization
    connectedCallback() {
        let soqlWithId = this.SOQL;
                        //`SELECT MailingState, COUNT(Id) contCount 
                        //FROM Contact 
                        //WHERE AccountId = {recordId} 
                        //GROUP BY MailingState `;
        soqlWithId = soqlWithId.replace( "{recordId}", `'${this.recordId}'` );

        dynamicQuery( { soqlParam: soqlWithId } )
                .then( result => {
                    window.console.log( 'result', JSON.stringify( result ) );

                    const payload = { dataSource: this.componentName
                                , result: result 
                            };

                    console.log( 'firing sourceDataChangeEvent from dataSourceQuery: ', this.componentName );

                    // propagate query results to other components that may need it
                    fireEvent( this.pageRef, 'sourceDataChangeEvent', payload );
                } )
                .catch( error => {
                    const errorMsg = ( error.message ) ? error.message : error.body.message;
                    window.console.log( 'errorMsg', errorMsg );
                    this.dispatchEvent( new ShowToastEvent( {
                                                    title: 'Error querying record.',
                                                    message: errorMsg,
                                                    variant: 'error',
                                                } )
                                        );
                } );

        }
}