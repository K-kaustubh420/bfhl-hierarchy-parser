type Hierarchy = {
  root: string;
  tree: Record<string, any>;
  depth?: number;
  has_cycle?: true;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body || !Array.isArray(body.data)) {
      return Response.json(
        { error: "Expected { data: string[] }" },
        { status: 400 }
      );
    }

    const input: string[] = body.data;

    const invalid_entries: string[] = [];
    const duplicate_edges: string[] = [];

    const seenEdges = new Set<string>();
    const duplicateOnce = new Set<string>();
    const validEdges: [string, string][] = [];

    // ---- validation + duplicate filtering ----
    for (const raw of input) {
      if (typeof raw !== "string") {
        invalid_entries.push(String(raw));
        continue;
      }

      const s = raw.trim();
      const match = /^([A-Z])->([A-Z])$/.exec(s);

      if (!match) {
        invalid_entries.push(raw);
        continue;
      }

      const p = match[1];
      const c = match[2];

      if (p === c) {
        invalid_entries.push(raw);
        continue;
      }

      const key = `${p}->${c}`;

      if (seenEdges.has(key)) {
        if (!duplicateOnce.has(key)) {
          duplicate_edges.push(key);
          duplicateOnce.add(key);
        }
        continue;
      }

      seenEdges.add(key);
      validEdges.push([p, c]);
    }

    // ---- multi-parent rule: first parent wins ----
    const childTaken = new Set<string>();
    const edges: [string, string][] = [];

    for (const [p, c] of validEdges) {
      if (childTaken.has(c)) continue;
      childTaken.add(c);
      edges.push([p, c]);
    }

    // ---- build adjacency ----
    const adj: Record<string, string[]> = {};
    const nodes = new Set<string>();

    for (const [p, c] of edges) {
      if (!adj[p]) adj[p] = [];
      adj[p].push(c);
      nodes.add(p);
      nodes.add(c);
    }

    // ensure all nodes exist in adj
    for (const n of nodes) {
      if (!adj[n]) adj[n] = [];
    }

    // sort adjacency for deterministic output
    for (const k in adj) {
      adj[k].sort();
    }

    // ---- build undirected map for components ----
    const undirected: Record<string, string[]> = {};

    for (const n of nodes) undirected[n] = [];

    for (const [p, c] of edges) {
      undirected[p].push(c);
      undirected[c].push(p);
    }

    for (const k in undirected) {
      undirected[k].sort();
    }

    // ---- helpers ----
    const getComponent = (start: string) => {
      const stack = [start];
      const comp = new Set<string>();

      while (stack.length) {
        const n = stack.pop()!;
        if (comp.has(n)) continue;
        comp.add(n);

        for (const nei of undirected[n]) {
          if (!comp.has(nei)) stack.push(nei);
        }
      }

      return comp;
    };

    const hasCycle = (node: string, visited: Set<string>, rec: Set<string>): boolean => {
      visited.add(node);
      rec.add(node);

      for (const nei of adj[node]) {
        if (!visited.has(nei)) {
          if (hasCycle(nei, visited, rec)) return true;
        } else if (rec.has(nei)) {
          return true;
        }
      }

      rec.delete(node);
      return false;
    };

    const buildTree = (node: string): any => {
      const children = adj[node];
      const out: Record<string, any> = {};

      for (const c of children) {
        out[c] = buildTree(c);
      }

      return out;
    };

    const getDepth = (node: string): number => {
      const children = adj[node];
      if (children.length === 0) return 1;

      let max = 0;
      for (const c of children) {
        const d = getDepth(c);
        if (d > max) max = d;
      }
      return 1 + max;
    };

    // ---- process components ----
    const visitedGlobal = new Set<string>();
    const hierarchies: Hierarchy[] = [];

    const sortedNodes = Array.from(nodes).sort();

    for (const n of sortedNodes) {
      if (visitedGlobal.has(n)) continue;

      const comp = getComponent(n);
      comp.forEach((x) => visitedGlobal.add(x));

      const compNodes = Array.from(comp).sort();

      // compute child set within component
      const compChild = new Set<string>();
      for (const [p, c] of edges) {
        if (comp.has(p)) compChild.add(c);
      }

      // roots = nodes not appearing as child
      const roots = compNodes.filter((x) => !compChild.has(x));

      let root: string;

      if (roots.length === 0) {
        // pure cycle case
        root = compNodes[0];
      } else {
        root = roots[0];
      }

      const cycle = hasCycle(root, new Set(), new Set());

      if (cycle) {
        hierarchies.push({
          root,
          tree: {},
          has_cycle: true,
        });
      } else {
        const tree = { [root]: buildTree(root) };
        const depth = getDepth(root);

        hierarchies.push({
          root,
          tree,
          depth,
        });
      }
    }

    // ---- summary ----
    let total_trees = 0;
    let total_cycles = 0;
    let largest_tree_root = "";
    let maxDepth = -1;

    for (const h of hierarchies) {
      if (h.has_cycle) {
        total_cycles++;
      } else {
        total_trees++;

        const d = h.depth!;
        if (d > maxDepth) {
          maxDepth = d;
          largest_tree_root = h.root;
        } else if (d === maxDepth && h.root < largest_tree_root) {
          largest_tree_root = h.root;
        }
      }
    }

    return Response.json({
      user_id: "kaustubhkushwaha_26062004",
      email_id: "kk6682@srmist.edu.in",
      college_roll_number: "RA2311003010645",
      hierarchies,
      invalid_entries,
      duplicate_edges,
      summary: {
        total_trees,
        total_cycles,
        largest_tree_root,
      },
    });
  } catch {
    return Response.json(
      { error: "Unexpected error" },
      { status: 500 }
    );
  }
}