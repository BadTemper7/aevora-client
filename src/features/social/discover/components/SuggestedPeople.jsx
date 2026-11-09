import { useState } from "react";

import UserCard from "../../../../components/common/UserCard";
import Button from "../../../../components/ui/Button";
import { suggestedPeople } from "../../feed/data/mock";

export default function SuggestedPeople() {
  const [requested, setRequested] = useState(() => new Set());

  const toggle = (id) =>
    setRequested((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <section aria-labelledby="people-heading">
      <h2 id="people-heading" className="px-1 text-base font-bold text-ink">
        People you may know
      </h2>

      <ul className="mt-4 space-y-4 px-1">
        {suggestedPeople.map((person) => {
          const isRequested = requested.has(person.id);
          return (
            <li key={person.id}>
              <UserCard
                name={person.name}
                detail={`${person.mutual} mutual connections`}
                action={
                  <Button
                    size="sm"
                    variant={isRequested ? "secondary" : "primary"}
                    aria-pressed={isRequested}
                    aria-label={`${isRequested ? "Cancel request to" : "Add"} ${person.name}`}
                    onClick={() => toggle(person.id)}
                  >
                    {isRequested ? "Requested" : "Add"}
                  </Button>
                }
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
