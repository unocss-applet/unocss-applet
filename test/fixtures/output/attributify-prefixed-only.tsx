export default function App() {
  const c = 'text-red'
  const isOpen = true
  // single-letter identifiers that collide with utility names (b = border-width) — the
  // transformer must NOT consume them as utilities from inside the {...} expression
  const b = 'wide'
  const d = 'narrow'

  return (
    <div className="text-center aaa" p="2.5" text-blue>
      {/* static value + value-less shorthand + un- prefix */}
      <div text="4xl" ma text-green className="p-2"/>
      {/* variant values */}
      <div bg="pink dark:yellow hover:green">
        dark
      </div>
      {/* dynamic className — single identifier: expr wrapped into template literal, utilities appended */}
      <div className={c} m-2 hover-class={['!bg-green']} />
      {/* dynamic className — ternary with spaces: brace balancing must capture the full expr */}
      <div className={isOpen ? 'open' : 'closed'} m-2 />
      {/* dynamic className — bare identifiers colliding with utility names (b, d) must NOT be
          consumed from inside {...}; only the outer m-2 should be appended */}
      <div className={isOpen ? b : d} m-2 />
      {/* dynamic className — template literal: brace balancing handles inner ${} */}
      <div className={`base ${c}`} m-2 />
      {/* dynamic className — spaced identifier: brace balancing handles `{ c }` */}
      <div className={ c } m-2 />
      {/* dynamic class (not className) — must rewrite the actual attribute name seen */}
      <div class={c} m-2 />
      {/* flex shorthand + existing static className — should append */}
      <div flex="~ col gap-1" className="p-1" items-center text="#fff" />
      {/* un- prefix variant + important modifier */}
      <div text-right h-10 text="!pink" className="b b-green">
        123456789
      </div>
      {/* spread attribute — must be skipped entirely */}
      <div {...({} as any)} text-red />
      {/* regression: mid-tag spread (after a static className) — inner identifiers that look
          like utilities (`flex`, `block`) must NOT be consumed and deleted from the spread */}
      <div className="x" {...{ a: flex, b: block }} text-red />
      {/* icon + value-less combo (note: tokens with `.` like `mt-2.5`, or `:` variants like
          `dark:xxx`, can't be bare JSX attributes — they go through className instead) */}
      <div i-carbon-logo-twitter mt-2 />
      {/* nesting + appending to existing className */}
      <div className="[&>div]:w-10" text-red>
        <div text-left>
          1
        </div>
        <div text-center className="color-[#233]">
          2
        </div>
        <div text-right>
          3
        </div>
      </div>
      {/* size conflict test */}
      <div className="size-10" size="20" />
      {/* dynamic non-class attribute — must be skipped (can't be statically compiled);
          `m-2` shorthand is still collected */}
      <div onClick={handler} m-2 />
      {/* sibling attribute whose value equals the static className literal — utilities must
          append to className, not to the colliding sibling (regression for first-match replace) */}
      <div data-foo="text-red" className="text-red" mt-2 />
      {/* regression: `$` inside dynamic expr must be inserted literally, not treated as a
          replacement pattern. `${` alone would close a template literal prematurely. */}
      <div className={`a$`} m-2 />
      <div className={x ? '$&' : y} m-2 />
      {/* regression: static class value containing `$&` must be appended literally */}
      <div className="$&" m-2 />
    </div>
  )
}
