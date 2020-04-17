import React from "react";
import $ from "jquery";
import ReactDOM from "react-dom";

/**
 * The "+ Add" button on entity pages and browsing pages.
 */
export default class DropdownList extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            isLoading: false,
            isExpanded: false,
            isSuccess: false,
            isError: false,
            lists: [],
            selectedVariation: undefined
        };
    }

    /**
     *
     */
    componentDidMount() {
        $('body').on('click', this.checkBodyClick.bind(this));
    }

    /**
     * Render the button and/or expanded list.
     * @returns {*}
     */
    render() {
        let labelClass = 'fa-plus';
        let label = 'List';
        let showClass = '';
        let listData = null;
        let variationsDropdown = null;

        // We always draw the variations dropdown if variations exist.
        if (typeof this.props.variations === 'object') {
            const keys = Object.keys(this.props.variations);
            if (keys.length > 0) {
                const variationsList = [];

                // Default is none/any
                variationsList.push((
                    <option key="no-selection" value="">
                        Any
                    </option>
                ));

                // Now show the variations.
                for (let key of keys) {
                    const displayValue = this.props.variations[key];
                    variationsList.push((
                        <option key={key} value={key}>
                            {displayValue}
                        </option>
                    ));
                }

                variationsDropdown = (
                    <div className="mr-2">
                        <select className="form-control" onChange={this.setVariation.bind(this)}>
                            {variationsList}
                        </select>
                    </div>
                );
            }
        }

        if (this.state.isError) { // On error, do nothing.
            labelClass = 'fa-exclamation text-danger';
            label = 'Sorry';
        } else if (this.state.isLoading) { // On loading, do nothing.
            labelClass = 'fa-spin fa-spinner';
            label = '...';
        } else if (this.state.isSuccess) {
            labelClass = 'fa-check text-success';
            label = 'Done';
        } else if (this.state.isExpanded) {
            showClass = 'show';

            // Load the list up.
            if (typeof this.state.lists !== 'undefined') {
                const listItems = [];
                for (let list of this.state.lists) {
                    if (list.isAddLink) {
                        listItems.push((
                            <a key="add-link" className="dropdown-item" href="/list/create">
                                New list...
                            </a>
                        ));
                    } else {
                        let addOrRemove = list.hasEntity ? 'Remove from' : 'Add to';
                        listItems.push((
                            <a key={list.id} className="dropdown-item" href="#"
                               onMouseDown={this.toggleList.bind(this, list.id, list.hasEntity)}>
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

        let labelSpan = null;
        if (this.props.showLabel) {
            labelSpan = (
                <span>&nbsp;{label}</span>
            );
        }
        return (
            <div className="d-flex justify-content-between align-items-center">
                {variationsDropdown}
                <div>
                    <div className={'dropdown-list-container dropdown ' + showClass}>
                        <button type="button" className="btn btn-outline-secondary" onClick={this.buttonClicked.bind(this)}>
                            <span className={'fa ' + labelClass}></span>{labelSpan}
                        </button>
                        {listData}
                    </div>
                </div>
            </div>
        );
    }

    /**
     * Open or close the list.
     *
     * @param e
     */
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
            }

            // Request data from server and load the list when it's ready.
            let entityIdString = this.props.entityId;
            if (this.state.selectedVariation) {
                entityIdString += '/' + this.state.selectedVariation;
            }
            $.ajax({
                url: '/list/user/' + this.props.entityType + '/' + entityIdString,
                type: 'GET',
                dataType: 'json',
                success: listsReturned,
                error: this.onError.bind(this)
            });
        }
    }

    /**
     * Error state manager.
     */
    onError() {
        // Set not loading, not expanded, set error bit
        this.setState({
            isLoading: false,
            isExpanded: false,
            isError: true,
            isSuccess: false
        });
    }

    /**
     * Toggle an entity in a list.
     *
     * @param listId
     * @param hasEntity
     * @param e
     */
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
                variationId: this.state.selectedVariation,
                type: this.props.entityType,
                add: !hasEntity // flip the bit
            }
        });
    }

    /**
     * Update the selected variation.
     *
     * @param e
     */
    setVariation(e) {
        let selectedVariation = undefined;
        if (e && e.target && typeof e.target.value === 'string') {
            selectedVariation = e.target.value.length > 0 ?
                e.target.value : undefined;
        }

        this.setState({
            selectedVariation: selectedVariation
        });

        // TODO: In the long run, this really needs to be part of the component and not modifying external DOM elems.
        if (selectedVariation && typeof this.props.variationImages !== 'undefined' &&
            typeof this.props.variationImages[selectedVariation] !== 'undefined' &&
            typeof this.props.variationImages[selectedVariation].medium !== 'undefined' &&
            typeof this.props.variationImages[selectedVariation].full !== 'undefined') {
            $(this.props.imageLinkSelector).attr('href', this.props.variationImages[selectedVariation].full);
            $(this.props.imageElementSelector).attr('src', this.props.variationImages[selectedVariation].medium);
        } else {
            $(this.props.imageLinkSelector).attr('href', this.props.fullBaseImage);
            $(this.props.imageElementSelector).attr('src' ,this.props.mediumBaseImage);
        }

    }

    /**
     * Hide list if a click event occurs outside of us.
     *
     * @param e
     */
    checkBodyClick(e) {
        if (e && e.target) {
            if ($(e.target).closest('.dropdown-list-container').length === 0) {
                this.setState({
                    isExpanded: false
                });
            }
        }
    }
}

/**
 * When DOM ready, initialize any entity add buttons that are requested.
 */
$(document).ready(function() {
    $('div.entity-dropdown-init').each(function (i, elem) {
        const target = $(elem);
        const entityType = target.data('entity-type');
        const entityId = target.data('entity-id');
        const showLabel = target.data('show-label');
        const variations = target.data('variations');
        const variationImages = target.data('variation-images');
        const fullBaseImage = target.data('full-base-image');
        const mediumBaseImage = target.data('medium-base-image');
        ReactDOM.render(<DropdownList entityType={entityType} entityId={entityId} showLabel={showLabel}
            variations={variations} variationImages={variationImages}
            fullBaseImage={fullBaseImage} mediumBaseImage={mediumBaseImage}
            imageLinkSelector="#item-image-link" imageElementSelector="#item-image" />, elem);
    });
})