import assert from "node:assert/strict";
import {
    buildFourPieceTriangle, polygonArea, isSimpleBoundary,
    findValidPolygonDissection, verifyReconstruction
} from "../src/geometry.js";

const epsilon = 1e-9;
const close = (a, b) => Math.abs(a - b) < epsilon;
const pointClose = (a, b) => Math.hypot(a.x-b.x, a.y-b.y) < epsilon;
const cross = (a,b,p) => (b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x);
const edges = v => v.map((a,i) => [a, v[(i+1)%v.length]]);
const distance = (a,b) => Math.hypot(a.x-b.x, a.y-b.y);
const onBoundary = (a,b,outer) => edges(outer).some(([u,v]) =>
    [a,b].every(p => Math.abs(cross(u,v,p)) < epsilon &&
        distance(u,p) + distance(p,v) <= distance(u,v) + epsilon)
);
const overlap = (a,b) => [...edges(a),...edges(b)].every(([u,v]) => {
    const project = p => cross(u,v,p);
    const x = a.map(project), y = b.map(project);
    return Math.min(Math.max(...x),Math.max(...y)) -
        Math.max(Math.min(...x),Math.min(...y)) > epsilon;
});

for (const c of [{x:-1,y:3}, {x:0,y:4*Math.sqrt(3)}, {x:4,y:6}]) {
    const {vertices, before, after} =
        buildFourPieceTriangle({x:-4,y:0}, {x:4,y:0}, c);
    assert.equal(before.length,4);
    assert.equal(after.length,4);
    const targets = [1,0,2,3];
    for (const [i,p] of before.entries()) {
        const q = after[i];
        assert.ok(q.vertices.every(v => before[targets[i]].vertices.some(w => pointClose(v,w))));
        assert.deepEqual(q.originalEdges,p.originalEdges);
        edges(p.vertices).forEach(([a,b],j) => {
            const k = (j+1)%p.vertices.length;
            const marked = p.originalEdges.some(([u,v]) => u===j && v===k);
            assert.equal(onBoundary(a,b,vertices),marked);
            assert.equal(onBoundary(q.vertices[j],q.vertices[k],vertices),!marked);
            assert.ok(close(distance(a,b),distance(q.vertices[j],q.vertices[k])));
        });
    }
    for (const state of [before,after]) {
        for (const [i,p] of state.entries()) {
            assert.ok(isSimpleBoundary(p.vertices));
            assert.ok(p.vertices.every(v => edges(vertices).every(([a,b]) => cross(a,b,v) >= -epsilon)));
            assert.ok(state.slice(i+1).every(q => !overlap(p.vertices,q.vertices)));
        }
        assert.ok(close(state.reduce((a,p) => a+polygonArea(p.vertices),0), polygonArea(vertices)));
    }
}
const rectangle = [{x:0,y:0},{x:10,y:0},{x:10,y:2},{x:0,y:2}];
const result = findValidPolygonDissection(rectangle);
assert.equal(result.attempts.length, 2);
assert.equal(result.before.length, 9);
assert.ok(verifyReconstruction(result));
assert.throws(() => findValidPolygonDissection([rectangle[0],rectangle[2],rectangle[1],rectangle[3]]), /simple polygon/);
console.log("Geometry checks passed: three four-piece triangles, retry, and invalid boundary.");
