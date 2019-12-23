import React from "react";

/**
 *
 */
export default class FilterList extends React.Component {
    /**
     *
     * @param props
     */
    constructor(props) {
        super(props);

        // Initial state.
        this.state = {
            expandedFilters: [],
            mobileExpanded: false
        };

        // Bindings
        this.toggleMobileExpand = this.toggleMobileExpand.bind(this);
    }

    /**
     *
     * @returns {*}
     */
    render() {
        const filters = [];

        // Build out the available filters list, and add state information to it.
        let counter = 0; // for unique ID for each form element.
        for (let filterId in this.props.availableFilters) {
            let filter = this.props.availableFilters[filterId];
            let valueOptions = [];
            for (let valueId in filter.values) {
                let label = filter.values[valueId];
                const isApplied = this.isFilterApplied(filterId, valueId);
                valueOptions.push((
                    <div className="form-check" key={filterId + '-' + counter}>
                        <input className="form-check-input" type="checkbox"
                               value={valueId} id={filterId + '-' + counter}
                               onChange={this.toggleFilterValue.bind(this, filterId, valueId)}
                               checked={isApplied} />
                        <label className="form-check-label" htmlFor={filterId + '-' + counter}>
                            {label}
                        </label>
                    </div>
                ));
                counter++;
            }

            // No sense in showing less than two options, right?
            if (valueOptions.length >= 2) {
                let caretClassName = 'fa-chevron-down';
                // Only show value options if expanded.
                if (!this.state.expandedFilters.includes(filterId)) {
                    valueOptions = [];
                    caretClassName = 'fa-chevron-up';
                }
                filters.push((
                    <div className="mb-3" key={filterId}>
                        <div className="mb-2">
                            <a href="#" className="filter-root" onClick={this.expandCollapse.bind(this, filterId)}>
                                <span className="font-weight-bold">{filter.name}</span>
                                <span aria-hidden="true" className={'fas ' + caretClassName} style={{float: 'right'}}></span>
                            </a>
                        </div>
                        {valueOptions}
                    </div>
                ));
            }
        }

        const mobileFilterText = this.state.mobileExpanded ? 'Hide Filters' : 'Show Filters';
        const mobileFilterClass = this.state.mobileExpanded ? 'expanded-sm' : 'not-expanded-sm';
        return (
            <div className="filter-container">
                <button className="btn btn-secondary d-block d-md-none mb-3" onClick={this.toggleMobileExpand}>
                    {mobileFilterText}
                </button>
                <div className={'filter-options ' + mobileFilterClass}>
                    {filters}
                </div>
            </div>
        );
    }

    /**
     *
     * @param filterId
     * @param valueId
     * @returns {*|boolean|boolean}
     */
    isFilterApplied(filterId, valueId) {
        if (this.props.appliedFilters) {
            if (this.props.appliedFilters[filterId]) {
                return this.props.appliedFilters[filterId].includes(valueId);
            }
        }

        return false;
    }

    /**
     * Toggle the given filter. Then, call the parent to let it know we changed.
     *
     * @param filterId
     * @param valueId
     * @param e
     */
    toggleFilterValue(filterId, valueId, e) {
        const appliedFilters = JSON.parse(JSON.stringify(this.props.appliedFilters));

        if (appliedFilters[filterId] && appliedFilters[filterId].includes(valueId)) {
            // If already applied, remove it.
            appliedFilters[filterId] = appliedFilters[filterId].filter((v) => { return v !== valueId; });
            if (appliedFilters[filterId].length === 0) {
                delete appliedFilters[filterId]; // clean it up!
            }
        } else {
            // If not applied, add it.
            if (!appliedFilters[filterId]) {
                // Create the filter entry if not existing.
                appliedFilters[filterId] = [];
            }
            appliedFilters[filterId].push(valueId);
        }

        this.props.onFilterChange(appliedFilters);
    };

    /**
     * Expand or collapse a filter. By default, filters are collapsed.
     *
     * @param filterId
     * @param e
     */
    expandCollapse(filterId, e) {
        e.preventDefault();

        const collapse = this.state.expandedFilters.includes(filterId);
        this.setState((state) => {
            let expandedFilters = [];
            if (collapse) {
                expandedFilters = state.expandedFilters.filter((i) => {
                    return i !== filterId;
                })
            } else {
                expandedFilters = this.state.expandedFilters.concat(filterId);
            }

            return {
                expandedFilters: expandedFilters
            }
        });
    }

    toggleMobileExpand(e) {
        e.preventDefault();
        this.setState({
            mobileExpanded: !this.state.mobileExpanded
        });
    }
}
