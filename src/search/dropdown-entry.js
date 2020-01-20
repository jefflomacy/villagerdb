import React from "react";
import axios from "axios";

export default class DropdownEntry extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            addOrRemoveMessage: 'Add to'
        }
    }

    componentDidMount() {
        if (this.props.entityList.entities) {
            this.props.entityList.entities.some((entity) => {
                if (entity.entityId === this.props.entityData.entityId && entity.type === this.props.entityData.type) {
                    this.setState( { addOrRemoveMessage: 'Remove from' } );
                    return;
                }
            });
        } else {
            this.setState( { addOrRemoveMessage: 'Add to' } )
        }

    }

    handleChange(listId, entityId, type) {

        // Check if we are adding or removing an entity from the database.
        let add;
        if (this.state.addOrRemoveMessage === 'Add to') {
            add = true;
        } else {
            add = false;
        }

        // Grouping up data to POST.
        const list = {
            listId: listId,
            entityId: entityId,
            type: type,
            add: add
        }

        axios.post('http://localhost:3000/ajax/add-entity-to-list', { list })
            .then(res => {
                console.log("Modified entity in list.");
            });

        // Switch state.
        if (this.state.addOrRemoveMessage === 'Add to') {
            this.setState( { addOrRemoveMessage: 'Remove from' } )
        } else {
            this.setState( { addOrRemoveMessage: 'Add to' } )
        }

    }

    buildResults() {
        const result = [];
        result.push(
            <button type="button" className="dropdown-item" onClick={(e) => this.handleChange(this.props.entityList.id, this.props.entityData.entityId, this.props.entityData.type)}>
                {this.state.addOrRemoveMessage} {this.props.entityList.name}
            </button>
        );

        return result;
    }

    render() {
        return this.buildResults();
    }

}