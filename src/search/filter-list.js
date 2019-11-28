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

        // Only expand mobile by default if aggregable filters are applied.
        const aggregableFilterCount = Object.keys(this.props.appliedFilters)
            .filter((f) => {
                return this.props.allFilters[f].canAggregate;
            }).length;

        // Initial state.
        this.state = {
            expandedFilters: [],
            mobileExpanded: aggregableFilterCount > 0
        }

        // Bindings
        this.clearAllFilters = this.clearAllFilters.bind(this);
        this.toggleMobileExpand = this.toggleMobileExpand.bind(this);
    }

    /**
     *
     * @returns {*}
     */
    render() {
        const filters = [];

        // Show already-applied filters, if any.
        const alreadyApplied = [];
        for (let filterId in this.props.appliedFilters) {
            if (!this.props.allFilters[filterId].canAggregate) {
                continue; // skip textual search filters.
            }

            const values = this.props.appliedFilters[filterId].map((v) => {
                if (this.props.allFilters[filterId].values) {
                    return this.props.allFilters[filterId].values[v];
                } else {
                    return v;
                }
            });
            const valuesString = values.sort().join(', ');
            alreadyApplied.push(
                <li key={filterId}>
                    <span className="font-weight-bold">
                        {this.props.allFilters[filterId].name}
                    </span>: {valuesString}
                    <a href="#" className="ml-2" onClick={this.removeFilterClicked.bind(this, filterId)}>
                        <span className="fas fa-times sr-hidden" style={{color: 'red'}}></span>
                        <span className="sr-only">Delete filter</span>
                    </a>
                </li>
            )
        }

        if (alreadyApplied.length > 0) {
            filters.push(
                <div className="mb-3" key="already-applied">
                    <div className="mb-1">
                        <a className="filter-root">Applied Filters</a>
                    </div>
                    <ul className="list-unstyled">
                        {alreadyApplied}
                    </ul>
                    <a href="#" onClick={this.clearAllFilters}>Clear all</a>
                </div>
            );
        }

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
        const mobileFilterClass = this.state.mobileExpanded ? 'expanded-sm' : 'not-expanded-sm'
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

    removeFilterClicked(filterId, e) {
        e.preventDefault();
        this.removeFilter(filterId);
    }

    removeFilter(filterId) {
        const appliedFilters = JSON.parse(JSON.stringify(this.props.appliedFilters));
        delete appliedFilters[filterId];

        this.props.onFilterChange(appliedFilters);
    };

    clearAllFilters(e) {
        e.preventDefault();

        // Remove all aggregable filters.
        const appliedFilters = JSON.parse(JSON.stringify(this.props.appliedFilters));
        for (let filterId in appliedFilters) {
            if (this.props.allFilters[filterId].canAggregate) {
                delete appliedFilters[filterId];
            }
        }

        this.props.onFilterChange(appliedFilters);
    }

    /**
     * Expand or collapse a filter. By default, filters are collapsed.
     *
     * @param filterId
     * @param e
     */
    expandCollapse(filterId, e) {
        e.preventDefault();

        const expandedFilters = [];
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

    toggleMobileExpand() {
        this.setState({
            mobileExpanded: !this.state.mobileExpanded
        })
    }
}
