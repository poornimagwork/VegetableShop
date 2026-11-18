import VegetableCard from './VegetableCard';

function VegetableList({
  vegetables,
  loading,
  error,
  search,
  sort,
  order,
  page,
  pageSize,
  total,
  onSearch,
  onSort,
  onPage,
  onAddToCart,
}) {
  const pageCount = Math.max(Math.ceil(total / pageSize), 1);

  return (
    <section className="catalogue" aria-labelledby="catalogue-heading">
      <div className="section-heading">
        <h2 id="catalogue-heading">Fresh Produce</h2>
        <p>Select vegetables, enter quantity, and add them to your bill.</p>
      </div>

      <div className="catalogue-tools">
        <label className="sr-only" htmlFor="vegetable-search">
          Search vegetables
        </label>
        <input
          id="vegetable-search"
          type="search"
          placeholder="Search vegetables"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
        />
        <label className="sr-only" htmlFor="vegetable-sort">
          Sort vegetables
        </label>
        <select
          id="vegetable-sort"
          value={`${sort}:${order}`}
          onChange={(event) => {
            const [nextSort, nextOrder] = event.target.value.split(':');
            onSort(nextSort, nextOrder);
          }}
        >
          <option value="name:asc">Name A–Z</option>
          <option value="name:desc">Name Z–A</option>
          <option value="price:asc">Price: low to high</option>
          <option value="price:desc">Price: high to low</option>
        </select>
      </div>

      {loading ? <p className="status-line">Loading vegetables…</p> : null}
      {error ? (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      ) : null}
      {!loading && vegetables.length === 0 ? (
        <div className="empty-cart">
          <p>No vegetables match your search.</p>
        </div>
      ) : null}

      <div className="vegetable-grid">
        {vegetables.map((vegetable) => (
          <VegetableCard
            key={vegetable.id}
            vegetable={vegetable}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>

      <div className="pager">
        <button
          type="button"
          className="btn btn-clear"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
        >
          Previous
        </button>
        <span>
          Page {page} of {pageCount}
        </span>
        <button
          type="button"
          className="btn btn-clear"
          onClick={() => onPage(page + 1)}
          disabled={page >= pageCount}
        >
          Next
        </button>
      </div>
    </section>
  );
}

export default VegetableList;
