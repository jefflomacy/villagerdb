import React from "react";
import $ from "jquery";

export default class DropdownList extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            isLoading: false,
            isExpanded: false,
            isSuccess: false,
            isError: false,
            lists: []
        };
    }

    render() {
        let labelClass = 'fa-plus';
        let showClass = '';
        let listData = null;

        if (this.state.isError) { // On error, do nothing.
            labelClass = 'fa-exclamation text-danger';
        } else if (this.state.isLoading) { // On loading, do nothing.
            labelClass = 'fa-spin fa-spinner';
        } else if (this.state.isSuccess) {
            labelClass = 'fa-check text-success';
        } else if (this.state.isExpanded) {
            showClass = 'show';

            // Load the list up.
            if (typeof this.state.lists !== 'undefined') {
                const listItems = [];
                for (let list of this.state.lists) {
                    if (list.isAddLink) {
                        listItems.push((
                            <a key="add-link" className="dropdown-item" href="/list/create">
                                Create a new list
                            </a>
                        ));
                    } else {
                        let addOrRemove = list.hasEntity ? 'Remove from' : 'Add to';
                        listItems.push((
                            <a key={list.id} className="dropdown-item" href="#"
                               onClick={this.toggleList.bind(this, list.id, list.hasEntity)}>
                                {addOrRemove} <strong>{list.name}</strong>
                            </a>
                        ));
                    }
                }
                listData = (
                    <div className={'dropdown-menu ' + showClass}>
                        {listItems}
                    </div>
                );
            }
        }

        return (
            <div className={'dropdown ' + showClass}>
                <button type="button" className="btn btn-outline-secondary" onClick={this.buttonClicked.bind(this)}>
                    <span className={'fa ' + labelClass}></span>
                </button>
                {listData}
            </div>
        );
    }

    buttonClicked(e) {
        e.preventDefault();

        // Reset error and success state.
        this.setState({
            isError: false,
            isSuccess: false
        });

        // Do the work.
        if (this.state.isLoading) {
            return; // don't load twice.
        } else if (this.state.isExpanded) {
            this.setState({
                isExpanded: false // collapse
            });
            return;
        } else {
            // Start loading sequence.
            this.setState({
                isLoading: true
            });

            const listsReturned = (data) => {
                data.push({
                    isAddLink: true
                });

                this.setState({
                    isLoading: false,
                    isExpanded: true,
                    isError: false,
                    lists: data
                });
            };

            // Request data from server and load the list when it's ready.
            $.ajax({
                url: '/list/user/' + this.props.entityType + '/' + this.props.entityId,
                type: 'GET',
                dataType: 'json',
                success: listsReturned,
                error: this.onError.bind(this)
            });
        }
    }

    onError() {
        // Set not loading, not expanded, set error bit
        this.setState({
            isLoading: false,
            isExpanded: false,
            isError: true,
            isSuccess: false
        });
    }

    toggleList(listId, hasEntity, e) {
        e.preventDefault();

        // Set loading state and close list.
        this.setState({
            isLoading: true,
            isExpanded: false
        });

        // On success, set success state.
        const success = () => {
            this.setState({
                isLoading: false,
                isSuccess: true
            })
        };

        // Make request to server.
        $.ajax({
            url: '/list/entity-to-list',
            type: 'POST',
            dataType: 'json',
            success: success,
            error: this.onError.bind(this),
            data: {
                listId: listId,
                entityId: this.props.entityId,
                type: this.props.entityType,
                add: !hasEntity // flip the bit
            }
        });
    }
}