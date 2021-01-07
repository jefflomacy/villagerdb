import React from "react";
import ReactDOM from "react-dom"
import $ from 'jquery'

import Paginator from './paginator.js';
import SearchResults from './search-results.js';
import Loader from './loader.js';
import FilterList from './filter-list.js';
import AppliedFilters from './applied-filters.js';

/**
 *
 */
class Browser extends React.Component {
    constructor(props) {
        super(props);

        // Loading until we mount and can make a request.
        this.state = {
            isLoading: true,
            initialized: false
        };

        // Bindings
        this.setPage = this.setPage.bind(this);
        this.setAppliedFilters = this.setAppliedFilters.bind(this);
    }

    /**
     * When we mount, we: add the popstate event listener so the back/forward buttons work properly, and
     * initialize results from the server.
     */
    componentDidMount() {
        // Listen for pop state event.
        window.addEventListener('popstate', (event) => {
            if (event.state) {
                this.setState(event.state);
            } else {
                this.getResults(this.props.currentPage, this.props.appliedFilters, false);
            }
        });

        // Load initial results now
        this.getResults(this.props.currentPage, this.props.appliedFilters, false);
    }

    render() {
        // Not initialized yet?
        if (!this.state.initialized) {
            return (
                <div className="text-center" style={{'fontSize': '40px', 'color': '#003A70'}}>
                    <div className="fas fa-spin fa-spinner"></div>
                </div>
            )
        }

        // Error case.
        if (this.state.error) {
            let reason = undefined;
            if (this.state.errorText) {
                reason = (
                    <div>Let the mayor know that: <strong>{this.state.errorText}</strong></div>
                )
            }

            return (
                <div className="p-3 mb-2 bg-danger text-white">
                    <div>We're having some trouble. Try refreshing the page.</div>
                    {reason}
                </div>
            );
        }

        // Show loader?
        let loader = null;
        if (this.state.isLoading) {
            loader = (
                <Loader/>
            );
        }

        // Now, render!
        return (
            <div id={this.props.id}>
                {loader}
                <div className="row">
                    <div className="col-12 col-md-3">
                        <FilterList onFilterChange={this.setAppliedFilters}
                                    availableFilters={this.state.availableFilters}
                                    appliedFilters={this.state.appliedFilters}
                                    allFilters={this.props.allFilters} />
                    </div>
                    <div className="col-12 col-md-9">
                        <AppliedFilters onFilterChange={this.setAppliedFilters}
                                        appliedFilters={this.state.appliedFilters}
                                        allFilters={this.props.allFilters} />
                        <div className="browser-results-container">
                            <Paginator onPageChange={this.setPage}
                                       currentPage={this.state.currentPage}
                                       startIndex={this.state.startIndex}
                                       endIndex={this.state.endIndex}
                                       totalCount={this.state.totalCount}
                                       totalPages={this.state.totalPages}
                                       topAnchor="#browser" />
                            <SearchResults results={this.state.results} />
                            <Paginator onPageChange={this.setPage}
                                       currentPage={this.state.currentPage}
                                       startIndex={this.state.startIndex}
                                       endIndex={this.state.endIndex}
                                       totalCount={this.state.totalCount}
                                       totalPages={this.state.totalPages}
                                       topAnchor="#browser" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /**
     * Entry point for getting results from the server AJAX endpoint.
     * @param pageNumber
     * @param appliedFilters
     * @param pushState
     */
    getResults(pageNumber, appliedFilters, pushState) {
        // Handler for when AJAX request comes back
        const updateState = (response) => {
            const newState = {
                currentPage: response.currentPage,
                startIndex: response.startIndex,
                endIndex: response.endIndex,
                totalCount: response.totalCount,
                totalPages: response.totalPages,
                results: response.results,
                appliedFilters: response.appliedFilters,
                availableFilters: response.availableFilters,
                isLoading: false,
                initialized: true
            };

            // Should we push this state to history?
            if (pushState) {
                let url = this.getPageUrl(response.currentPage, response.appliedFilters);
                history.pushState(newState, null, url);
            }

            // Finally, set state.
            this.setState(newState);
        };

        // Set state to loading
        this.setState({
            appliedFilters: appliedFilters,
            currentPage: pageNumber,
            isLoading: true
        });

        // Make AJAX request to get the results, which is then handled by updateState
        const url = this.getAjaxUrl(pageNumber, appliedFilters);
        $.ajax({
            url: url,
            type: 'GET',
            dataType: 'json',
            success: updateState,
            error: this.onError.bind(this)
        });
    }

    /**
     * Set the current page number.
     *
     * @param pageNumber
     */
    setPage(pageNumber) {
        this.getResults(pageNumber, this.state.appliedFilters, true);
    }

    /**
     * Apply the given filters from the FilterList or AppliedFilters components.
     *
     * @param filters
     */
    setAppliedFilters(filters) {
        // Changing the filters will always put us back on page 1.
        this.getResults(1, filters, true);
    }

    /**
     * Error handler when AJAX request fails.
     *
     * @param jqXHR
     */
    onError(jqXHR) {
        // Try to get explanation from the server if possible.
        let errorText = undefined;
        if (jqXHR) {
            try {
                const decoded = JSON.parse(jqXHR.responseText);
                errorText = decoded.errorText;
            } catch (e) {
                console.error(e);
            }
        }

        // Errors are unrecoverable, so put us into that state.
        this.setState({
            isLoading: false,
            initialized: true,
            error: true,
            errorText: errorText
        });
    }

    /**
     * Build the query parameters that are made up of what filters are currently applied by the user, such as
     * ?game=nh&q=Raymond
     * @param pageNumber
     * @param appliedFilters
     * @returns {string}
     */
    getFilterUrlQuery(pageNumber, appliedFilters) {
        // Build out from applied filters
        const applied = [];
        for (let filterId in appliedFilters) {
            const values = [];
            for (let value of appliedFilters[filterId]) {
                values.push(encodeURIComponent(value));
            }
            applied.push(filterId + '=' + values.join(','));
        }
        return applied.length > 0 ? ('?' + applied.join('&')) : '';
    }

    /**
     * Get the AJAX URL endpoint for the server.
     * @param pageNumber
     * @param appliedFilters
     * @returns {string}
     */
    getAjaxUrl(pageNumber, appliedFilters) {
        const filterQuery = this.getFilterUrlQuery(pageNumber, appliedFilters);
        return this.props.ajaxUrlPrefix + pageNumber + filterQuery;
    }

    /**
     * Get the user-friendly frontend URL for the page.
     * @param pageNumber
     * @param appliedFilters
     * @returns {string}
     */
    getPageUrl(pageNumber, appliedFilters) {
        const filterQuery = this.getFilterUrlQuery(pageNumber, appliedFilters);
        return this.props.pageUrlPrefix + pageNumber + filterQuery;
    }
}

/**
 * When DOM ready, initialize the browser.
 */
$(document).ready(function() {
    const targetElement = $('#entity-browser');
    if (targetElement.length !== 1) {
        return;
    }

    const ajaxUrlPrefix = targetElement.data('ajax-url-prefix');
    const pageUrlPrefix = targetElement.data('page-url-prefix');
    const allFilters = targetElement.data('all-filters');
    const appliedFilters = targetElement.data('applied-filters');
    const currentPage = targetElement.data('current-page');
    ReactDOM.render(<Browser
        id="browser"
        ajaxUrlPrefix={ajaxUrlPrefix}
        pageUrlPrefix={pageUrlPrefix}
        allFilters={allFilters}
        appliedFilters={appliedFilters}
        currentPage={currentPage} />, targetElement[0]);
})
