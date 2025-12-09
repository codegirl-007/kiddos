export function Footer() {
  return (
    <footer className="bg-muted border-t border-border mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-foreground mb-4">Rainbow, Cupcakes and Unicorns</h3>
            <p className="text-sm text-muted-foreground">
              Making education and fun accessible for every child, completely free.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-foreground mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="/" className="hover:text-foreground transition-colors">
                  All Games
                </a>
              </li>
              <li>
                <a href="/" className="hover:text-foreground transition-colors">
                  Categories
                </a>
              </li>
              <li>
                <a href="/" className="hover:text-foreground transition-colors">
                  Top Rated
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-foreground mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>© 2025 PlayLearn. Free learning for all children. No ads, no logins, no worries! 🎓</p>
        </div>
      </div>
    </footer>
  );
}
