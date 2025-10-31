import XCTest
import SwiftTreeSitter
import TreeSitterHeptagon

final class TreeSitterHeptagonTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_heptagon())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading heptagon grammar")
    }
}
