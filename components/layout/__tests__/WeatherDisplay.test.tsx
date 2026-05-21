import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import WeatherDisplay from '../WeatherDisplay';

// Mock useAuthContext — WeatherDisplay reads context.weather directly
const mockUseAuthContext = vi.fn();
vi.mock('@/contexts/AuthContext', () => ({
  useAuthContext: () => mockUseAuthContext(),
}));

describe('WeatherDisplay', () => {
  beforeEach(() => {
    mockUseAuthContext.mockReset();
    vi.clearAllMocks();
  });

  it('renders nothing when context is null', () => {
    mockUseAuthContext.mockReturnValue({ context: null });
    const { container } = render(<WeatherDisplay />);
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when context.weather is null', () => {
    mockUseAuthContext.mockReturnValue({
      context: {
        location: { country: 'ES', city: 'Madrid' },
        weather: null,
      },
    });
    const { container } = render(<WeatherDisplay />);
    expect(container.innerHTML).toBe('');
  });

  it('renders weather icon, temp, and description when weather is available', () => {
    mockUseAuthContext.mockReturnValue({
      context: {
        location: { country: 'ES', city: 'Madrid' },
        weather: {
          temp: 22,
          feels_like: 20,
          description: 'clear sky',
          icon: '01d',
          icon_url: 'https://openweathermap.org/img/wn/01d@2x.png',
          humidity: 45,
          wind_speed: 3.5,
        },
      },
    });

    render(<WeatherDisplay />);

    // Check img element
    const img = screen.getByAltText('clear sky');
    expect(img).toBeDefined();
    expect(img.getAttribute('src')).toBe(
      'https://openweathermap.org/img/wn/01d@2x.png'
    );

    // Check temp
    expect(screen.getByText('22°C')).toBeDefined();

    // Check description (visible on sm+)
    expect(screen.getByText('clear sky')).toBeDefined();
  });

  it('does not render broken image when icon_url is missing', () => {
    mockUseAuthContext.mockReturnValue({
      context: {
        location: { country: 'ES', city: 'Madrid' },
        weather: {
          temp: 18,
          feels_like: 16,
          description: 'cloudy',
          icon: '02d',
          icon_url: '',
          humidity: 60,
          wind_speed: 2.1,
        },
      },
    });

    render(<WeatherDisplay />);

    // img should not be in the document (empty icon_url)
    expect(screen.queryByAltText('cloudy')).toBeNull();

    // Temp should still be visible
    expect(screen.getByText('18°C')).toBeDefined();

    // Description should still be visible
    expect(screen.getByText('cloudy')).toBeDefined();
  });

  it('has correct aria-label for the weather group', () => {
    mockUseAuthContext.mockReturnValue({
      context: {
        location: { country: 'ES', city: 'Madrid' },
        weather: {
          temp: 25,
          feels_like: 23,
          description: 'sunny',
          icon: '01d',
          icon_url: 'https://example.com/sun.png',
          humidity: 30,
          wind_speed: 5.0,
        },
      },
    });

    render(<WeatherDisplay />);

    const group = screen.getByLabelText('Weather: 25°C, sunny');
    expect(group).toBeDefined();
  });

  it('handles undefined context gracefully', () => {
    mockUseAuthContext.mockReturnValue({ context: undefined });
    const { container } = render(<WeatherDisplay />);
    expect(container.innerHTML).toBe('');
  });
});
