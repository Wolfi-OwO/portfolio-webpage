import { useEffect, useState } from 'react';

// GET a collection once. The API answers { items: [...] } (HATEOAS list); an empty list is a valid, quiet fallback.
export function useApiList(path) {
    const [items, setItems] = useState([]);
    const [loaded, setLoaded] = useState(false);
    useEffect(() => {
        let active = true;
        fetch(path)
            .then((res) => (res.ok ? res.json() : { items: [] }))
            .then((body) => active && setItems(body.items || []))
            .catch(() => {})
            .finally(() => active && setLoaded(true));
        return () => {
            active = false;
        };
    }, [path]);
    return [items, setItems, loaded];
}
