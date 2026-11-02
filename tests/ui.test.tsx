import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BigIdea } from '../src/sidepanel/components/BigIdea';
import { SimpleExplanation } from '../src/sidepanel/components/SimpleExplanation';
import { KeyPoints } from '../src/sidepanel/components/KeyPoints';
import { ImportantNumbers } from '../src/sidepanel/components/ImportantNumbers';
import { DifficultTerms } from '../src/sidepanel/components/DifficultTerms';
import { BottomLine } from '../src/sidepanel/components/BottomLine';

describe('UI Summary Dashboard Rendering', () => {
  it('14. Renders all dashboard sections with proper typography and accessibility', () => {
    // 1. Big Idea
    render(<BigIdea text="Electric cars reduce tailpipe emissions to zero." />);
    expect(screen.getByText(/Electric cars reduce tailpipe emissions to zero/i)).toBeInTheDocument();
    expect(screen.getByText(/The Big Idea/i)).toBeInTheDocument();

    // 2. Simple Explanation
    render(<SimpleExplanation text="Instead of burning liquid gasoline in a small engine..." mode="eli12" />);
    expect(screen.getByText(/Explain It Like I'm 12/i)).toBeInTheDocument();
    expect(screen.getByText(/Instead of burning liquid gasoline/i)).toBeInTheDocument();

    // 3. Key Points
    render(
      <KeyPoints
        points={[
          { point: 'Battery Technology', explanation: 'Lithium-ion cells provide the energy.' },
          { point: 'Regenerative Braking', explanation: 'Recovers energy when slowing down.' },
        ]}
      />
    );
    expect(screen.getByText(/Battery Technology/i)).toBeInTheDocument();
    expect(screen.getByText(/Regenerative Braking/i)).toBeInTheDocument();

    // 4. Important Numbers
    render(
      <ImportantNumbers
        numbers={[
          { value: '300 Miles', context: 'Average range on a single charge' },
          { value: '80%', context: 'Charge in 30 minutes at DC fast chargers' },
        ]}
      />
    );
    expect(screen.getByText('300 Miles')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();

    // 5. Difficult Terms
    const onSelect = vi.fn();
    render(
      <DifficultTerms
        terms={[
          { term: 'Aerodynamic Drag', simple_definition: 'Air resistance slowing the vehicle down', example: 'Sticking your hand out of a car window' },
        ]}
        onSelectTerm={onSelect}
      />
    );
    expect(screen.getByText(/Aerodynamic Drag/i)).toBeInTheDocument();
    expect(screen.getByText(/car window/i)).toBeInTheDocument();

    // 6. Bottom Line
    render(<BottomLine text="Electric cars are cleaner, faster to respond, and becoming the new automotive standard." />);
    expect(screen.getByText(/The Bottom Line/i)).toBeInTheDocument();
    expect(screen.getByText(/Electric cars are cleaner/i)).toBeInTheDocument();
  });

  it('Omits sections gracefully when data is empty', () => {
    const { container: bigIdeaEmpty } = render(<BigIdea text="" />);
    expect(bigIdeaEmpty.firstChild).toBeNull();

    const { container: numbersEmpty } = render(<ImportantNumbers numbers={[]} />);
    expect(numbersEmpty.firstChild).toBeNull();

    const { container: termsEmpty } = render(<DifficultTerms terms={[]} onSelectTerm={() => {}} />);
    expect(termsEmpty.firstChild).toBeNull();
  });
});
