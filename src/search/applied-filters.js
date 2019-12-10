import React from "react";
import $ from 'jquery';

/**
 *
 */
export default class AppliedFilters extends React.Component {
    /**
     *
     * @param props
     */
    constructor(props) {
        super(props);
    }

    /**
     *
     * @returns {*}
     */
    render() {
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
                <li key={filterId} className="list-inline-item">
                    <span className="badge badge-dark">
                        <a href="#" onClick={this.removeFilterClicked.bind(this, filterId)}>
                            <span className="font-weight-bold">
                                {this.props.allFilters[filterId].name}
                            </span>: {valuesString}
                            <span className="ml-2 fas fa-times sr-hidden"></span>
                            <span className="sr-only">Delete filter</span>
                        </a>
                    </span>
                </li>
            )
        }

        if (alreadyApplied.length > 0) {
            return (
                <div className="applied-filters">
                    Applied filters:
                    <ul className="list-inline">
                        {alreadyApplied}
                    </ul>
                </div>
            )
        }

        return null;
    }

    /**
     * Remove the given filter.
     * @param filterId
     * @param e
     */
    removeFilterClicked(filterId, e) {
        e.preventDefault();
        const appliedFilters = JSON.parse(JSON.stringify(this.props.appliedFilters));
        delete appliedFilters[filterId];

        this.props.onFilterChange(appliedFilters);
    };
}
