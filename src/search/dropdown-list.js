import React from "react";
import $ from "jquery";
import ReactDOM from "react-dom";

/**
 * Internal name for DIY variations.
 *
 * @type {string}
 */
const diyVariationId = '_isDIY';

/**
 * The "+ Add" button on entity pages and browsing pages.
 */
export default class DropdownList extends React.Component {
    constructor(props) {
        super(props);

        // Initialize variation data if present. Note that DIY is a special variation we skip but mark a flag for.
        this.variations = [];
        this.hasDIY = false;
        if (typeof this.props.variations === 'object') {
            const variations = [];
            for (let v of Object.keys(this.props.variations)) {
                if (v !== diyVariationId) {
                    variations.push({
                        key: v,
                        value: this.props.variations[v]
                    });
                } else {
                    this.hasDIY = true;
                }
            }

            // Only display variations if there are 2 or more.
            if (variations.length > 1) {
                this.variations = variations;
            }
        }

        // Initialize state.
        this.state = {
            isLoading: false,
            isExpanded: false,
            isSuccess: false,
            isError: false,
            lists: [],
            variationIndex: -1, // -1 means "Any" unless diySelected is true.
            selectedVariation: undefined,
            diySelected: false
        };

        // Body click handler to unbind on unmount
        this.checkBodyHandler = this.checkBodyClick.bind(this);

        // DIY toggle
        this.toggleDIY = this.toggleDIY.bind(this);
    }

    /**
     * Remove click checker when we unmount to prevent memory leak in user's browser.
     */
    componentWillUnmount() {
        $('body').off('click', this.checkBodyHandler);
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
        let labelSpan = null;
        let previousLink = null;
        let nextLink = null;

        // Main state management.
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

        // Create or destroy the expansion listener.
        if (this.state.isExpanded) {
            $('body').on('click', this.checkBodyHandler);
        } else {
            $('body').off('click', this.checkBodyHandler);
        }

        // We always draw the variations dropdown if variations exist.
        if (this.variations.length > 0) {
            // Make the variations dropdown if enabled.
            if (this.props.displayDropdown) {
                const variationsList = [];

                // Now show the variations.
                if (this.state.diySelected) {
                    variationsList.push((
                        <option key={diyVariationId} value={diyVariationId}>Recipe</option>
                    ));
                } else {
                    // Default is none/any
                    variationsList.push((
                        <option key="no-selection" value="">
                            Any
                        </option>
                    ));

                    for (let v of this.variations) {
                        variationsList.push((
                            <option key={v.key} value={v.key}>
                                {v.value}
                            </option>
                        ));
                    }
                }

                const optionState = typeof this.state.selectedVariation === 'undefined' ? '' : this.state.selectedVariation;
                variationsDropdown = (
                    <div className="flex-fill ml-2">
                        <select className="form-control" value={optionState} onChange={this.variationDropdownSelectionChange.bind(this)}
                            disabled={this.state.diySelected}>
                            {variationsList}
                        </select>
                    </div>
                );
            }

            // Make the links
            const previousLinkClass = this.state.variationIndex <= -1 || this.state.diySelected
                ? 'disabled': '';
            const nextLinkClass = this.state.variationIndex >= this.variations.length - 1 || this.state.diySelected
                ? 'disabled' : '';
            previousLink = (
                <div className="slider-nav-link">
                    <a href="#" className={previousLinkClass} onClick={this.previousVariation.bind(this)}>
                        <span className="fa fa-arrow-left"></span>
                    </a>
                </div>
            );
            nextLink = (
                <div className="slider-nav-link">
                    <a href="#" className={nextLinkClass} onClick={this.nextVariation.bind(this)}>
                        <span className="fa fa-arrow-right"></span>
                    </a>
                </div>
            );
        }

        // Show label if dropdown not present and/or no variants.
        if (!this.props.displayDropdown || this.variations.length === 0) {
            labelSpan = (
                <span>&nbsp;{label}</span>
            );
        }

        // We need the image information for the final display.
        const image = this.getImage();
        const thumbImage = this.props.imageSize === 'thumb' ? image.thumb : image.medium;

        // Finally render!
        const buttonContainerClass = this.props.displayDropdown && this.variations.length > 0 ?
            'd-flex align-items-center mt-2' : 'd-inline-block mt-2';
        const targetUrl = this.props.url ? this.props.url : image.full;
        const linkTarget = this.props.url ? '_self' : '_blank';
        let nameDiv = undefined;
        if (this.props.url) {
            nameDiv = (
                <div>
                    <a href={targetUrl}>
                        {this.props.name}
                    </a>
                </div>
            );
        }

        // DIY selector
        let diySelector = null;
        if (this.hasDIY) {
            const checkboxAlignment = variationsDropdown ? 'text-right' : 'text-center';
            diySelector = (
                <div className={checkboxAlignment + ' mt-2 mb-2'}>
                    <div className="form-check">
                        <input type="checkbox" className="form-check-input"
                               id={this.props.entityType + '-' + this.props.entityId + '-diy'}
                               onChange={this.toggleDIY}
                               checked={this.state.diySelected} />
                        <label className="form-check-label"
                               htmlFor={this.props.entityType + '-' + this.props.entityId + '-diy'}>
                            Recipe
                        </label>
                    </div>
                </div>
            );
        }

        return (
            <div className="entity-slider-container">
                <div className="d-flex justify-content-between align-items-center entity-slider">
                    {previousLink}
                    <div className="flex-fill">
                        <a className="d-block" target={linkTarget} href={targetUrl}>
                            <img className="entity-slider-image" src={thumbImage} />
                        </a>
                    </div>
                    {nextLink}
                </div>
                {nameDiv}
                {diySelector}
                <div className={buttonContainerClass}>
                    <div>
                        <div className={'dropdown-list-container dropdown ' + showClass}>
                            <button type="button" className="btn btn-outline-secondary" onClick={this.buttonClicked.bind(this)}>
                                <span className={'fa ' + labelClass}></span>{labelSpan}
                            </button>
                            {listData}
                        </div>
                    </div>
                    {variationsDropdown}
                </div>
            </div>
        );
    }

    /**
     * Toggle whether or not a DIY is selected based on the checkbox state.
     *
     * @param e
     */
    toggleDIY(e) {
        if (e.target && e.target.type === 'checkbox') {
            const diySelected = e.target.checked;
            this.setState({
                diySelected: diySelected,
                variationIndex: -1, // always reset
                selectedVariation: diySelected ? diyVariationId : undefined // set to special val or reset
            });
        }
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
    variationDropdownSelectionChange(e) {
        let selectedVariation = undefined;
        if (e && e.target && typeof e.target.value === 'string') {
            selectedVariation = e.target.value.length > 0 ?
                e.target.value : undefined;
            this.setSelectedVariation(selectedVariation);
        }
    }

    /**
     * Set the selected variation by validating it. Also, updates the index.
     *
     * @param selectedVariation
     */
    setSelectedVariation(selectedVariation) {
        let validatedSelection = undefined;
        let variationIndex = -1;

        if (typeof selectedVariation !== 'undefined') {
            // Try to find this variation in the list and note its position.
            let counter = 0;
            for (let v of this.variations) {
                if (selectedVariation === v.key) {
                    validatedSelection = v.key;
                    variationIndex = counter;
                    break;
                }
                counter++;
            }
        }

        // Update state.
        this.setState({
            variationIndex: variationIndex,
            selectedVariation: validatedSelection
        });
    }

    /**
     * Back step variation by 1.
     *
     * @param e
     */
    previousVariation(e) {
        e.preventDefault();
        if (!this.state.diySelected) {
            if (this.state.variationIndex <= 0) {
                this.setSelectedVariation(undefined);
            } else {
                this.setSelectedVariation(this.variations[this.state.variationIndex - 1].key);
            }
        }
    }

    /**
     * Move variation forward by 1.
     * @param e
     */
    nextVariation(e) {
        e.preventDefault();
        if (!this.state.diySelected) {
            if (this.state.variationIndex >= this.variations.length - 1) {
                this.setSelectedVariation(this.variations[this.variations.length - 1].key);
            } else {
                this.setSelectedVariation(this.variations[this.state.variationIndex + 1].key);
            }
        }
    }

    /**
     * Get the metadata for the image that should presently display, be it the base image or a variation image.
     * @returns {*}
     */
    getImage() {
        const selectedVariation = this.state.selectedVariation;
        if (selectedVariation && typeof this.props.variationImages !== 'undefined' &&
            typeof this.props.variationImages[selectedVariation] !== 'undefined') {
            return this.props.variationImages[selectedVariation];
        } else {
            return this.props.image;
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
        const image = target.data('image');
        const variations = target.data('variations');
        const variationImages = target.data('variation-images');
        ReactDOM.render(<DropdownList entityType={entityType} entityId={entityId}
                                      image={image} variations={variations} variationImages={variationImages}
                                      imageSize="medium" displayDropdown={true} />,
            elem);
    });
})