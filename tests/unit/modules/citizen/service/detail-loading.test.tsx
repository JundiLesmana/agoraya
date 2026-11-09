/** @vitest-environment jsdom */

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CitizenSubmissionDetailLoading from "@/app/(citizen)/citizen/service/[id]/loading";

describe("citizen service detail loading", () => {
  it("renders the expected loading skeleton layout", () => {
    const { container } = render(<CitizenSubmissionDetailLoading />);

    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(9);
    expect(container.querySelectorAll(".grid.md\\:grid-cols-2.xl\\:grid-cols-4 .animate-pulse")).toHaveLength(4);
  });
});
