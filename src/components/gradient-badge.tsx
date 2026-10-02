import styled from "@emotion/styled";

export const GradientBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.85rem;
  border: 1.5px solid hsl(var(--ink));
  border-radius: 9999px;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: hsl(var(--ink));
  background: hsl(var(--vermillion) / 0.16);
  box-shadow: 2px 2px 0 0 hsl(var(--ink));
`;
